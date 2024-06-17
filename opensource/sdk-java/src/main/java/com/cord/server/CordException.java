package com.cord.server;

public class CordException extends Exception {
  public CordException() {
    super();
  }

  public CordException(String message) {
    super(message);
  }

  public CordException(Throwable cause) {
    super(cause);
  }

  public CordException(String message, Throwable cause) {
    super(message, cause);
  }
}
