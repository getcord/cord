# nginx configs

This nginx config plays a pretty key role in our infrastructure.

## prod-proxy.nginx.conf

We are running an NGINX instance on our EC2 prod machine, and this is the
config for it.

This NGINX accepts HTTP connections on port 80.

Requests for the `api.cord.com` hostname are forwarded to localhost:8161, which
is served by our server process.

Requests for `admin.cord.com` are forwarded to localhost:8123, which is served
by the same server process, but is a separate endpoint for admin connections.

Requests for `app.cord.com` are forwarded to the S3 bucket which contains
the static content. In reality, this should not happen, because we do not route
such events to our EC2 machine anyway. (It's a leftover from when we switched
to serving `app.cord.com` from S3, but might as well stay in place.)

Requests for all other `api.*`, `admin.*`, `app.*` hostnames (such as e.g.
`app.getradical.co`) are diverted to their canonical hostnames (`*.cord.com`).
Requests for any other hostname is diverted to our web site (`cord.com`).
