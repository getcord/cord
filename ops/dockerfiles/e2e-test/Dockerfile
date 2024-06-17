FROM cypress/base:18.16.1

RUN echo UTC >/etc/timezone \
  && export DEBIAN_FRONTEND=noninteractive \
  && apt-get update -y \
  && apt-get upgrade -y \
  && apt-get install -y --no-install-recommends \
    awscli \
    curl \
    gnupg \
    tzdata \
  && curl https://packages.microsoft.com/keys/microsoft.asc | \
     gpg --dearmor >/usr/share/keyrings/microsoft.gpg \
  && echo >/etc/apt/sources.list.d/microsoft-edge.list \
     'deb [arch=amd64 signed-by=/usr/share/keyrings/microsoft.gpg] https://packages.microsoft.com/repos/edge stable main' \
  && curl https://dl.google.com/linux/linux_signing_key.pub | \
     gpg --dearmor >/usr/share/keyrings/google.gpg \
  && echo >/etc/apt/sources.list.d/google-chrome.list \
     'deb [arch=amd64 signed-by=/usr/share/keyrings/google.gpg] http://dl.google.com/linux/chrome/deb/ stable main' \
  && apt-get update -y \
  && apt-get install -y --no-install-recommends \
    google-chrome-stable firefox-esr microsoft-edge-stable

COPY cypress.tar.gz /tmp
COPY entrypoint.sh /

RUN su node -c "cd && tar vxzf /tmp/cypress.tar.gz" && rm -R /tmp/cypress.tar.gz

USER node
WORKDIR /home/node/cypress

RUN npm ci && npm run build

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "run-prod"]

ARG GIT_COMMIT_HASH
ENV GIT_COMMIT_HASH=$GIT_COMMIT_HASH
