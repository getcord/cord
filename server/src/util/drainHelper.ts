import type * as http from 'http';
import * as https from 'https';
import type * as net from 'net';
import type * as tls from 'tls';

import { EventEmitter } from 'events';
import type TypedEventEmitter from 'typed-emitter';
import { anonymousLogger } from 'server/src/logging/Logger.ts';

interface DrainHelperEvents {
  draining: () => void;
  terminating: () => void;
}

type SocketWithDrainHelper = (tls.TLSSocket | net.Socket) & {
  cordConnectionDrainHelper?: DrainHelper;
};

export class DrainHelper extends (EventEmitter as new () => TypedEventEmitter.default<DrainHelperEvents>) {
  private draining = false;
  private terminating = false;
  private keepAliveCount = 0;

  /** Increment the activity count and return a function to decrement it later
   *
   * The activity count needs to reach zero for graceful shutdown to complete.
   * Any call to this function increments it, and it returns a function object
   * that needs to be called later to decrement it again. The returned function
   * only decrements the count once, even if called multiple times.
   */
  readonly keepAlive = () => {
    let complete = false;
    ++this.keepAliveCount;
    return () => {
      if (!complete) {
        complete = true;
        --this.keepAliveCount;
        if (this.keepAliveCount === 0) {
          if (this.draining && !this.terminating) {
            this.terminate();
          }
        }
      }
    };
  };

  isDraining = () => this.draining;
  isTerminating = () => this.terminating;

  drain() {
    if (!this.draining && !this.terminating) {
      this.draining = true;
      this.emit('draining');
      if (!this.keepAliveCount) {
        this.terminate();
      }
    }
  }

  private terminate() {
    if (!this.terminating) {
      this.draining = this.terminating = true;
      this.emit('terminating');
    }
  }

  waitUntilDraining() {
    return this.draining
      ? Promise.resolve()
      : new Promise<void>((resolve) => this.once('draining', resolve));
  }

  waitUntilTerminating() {
    return this.terminating
      ? Promise.resolve()
      : new Promise<void>((resolve) => this.once('terminating', resolve));
  }

  /**
   * Make this DrainHelper automatically keep itself alive through http server
   * connections
   *
   * The http(s) server passed to this functions will be equipped with event
   * handlers so that any existing connection keeps this DrainHelper alive (i.e.
   * delays the transition from 'draining' to 'terminating'). For each
   * connection in turn a new DrainHelper is instantiated, which keeps tracks of
   * ongoing requests on that connection. When we drain this whole thing, we
   * immediate start draining the connections, too, which means that they get
   * closed as soon as there is not ongoing request. And as soon as all
   * connections are closed, this http server stops keeping this DrainHelper
   * alive.
   */
  install(server: http.Server | https.Server) {
    const { keepAlive } = this;

    const connectionHandler = (socket: SocketWithDrainHelper) => {
      if (this.draining || this.terminating) {
        anonymousLogger().warn(
          `Incoming connection closed immediately because server is ${
            this.terminating ? 'terminating' : 'draining'
          }`,
        );
        socket.end();
      } else {
        const expireKeepAlive = keepAlive();

        const connectionDrainHelper = new DrainHelper();
        socket.cordConnectionDrainHelper = connectionDrainHelper;
        connectionDrainHelper.once('terminating', () => {
          socket.end();
          expireKeepAlive();
        });

        const drainConnection = () => connectionDrainHelper.drain();
        this.addListener('draining', drainConnection);

        socket.once('close', () => {
          expireKeepAlive();
          this.removeListener('draining', drainConnection);
        });
      }
    };

    if (server instanceof https.Server) {
      server.addListener('secureConnection', connectionHandler);
    } else {
      server.addListener('connection', connectionHandler);
    }

    server.addListener(
      'request',
      (req: http.IncomingMessage, res: http.ServerResponse) => {
        const { cordConnectionDrainHelper: connectionDrainHelper } =
          req.socket as SocketWithDrainHelper;
        if (connectionDrainHelper) {
          res.once('close', connectionDrainHelper.keepAlive());
        }

        if (this.draining && !res.headersSent) {
          res.setHeader('connection', 'close');
        }
      },
    );
  }
}
