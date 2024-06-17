FROM ubuntu:22.04

RUN echo UTC >/etc/timezone \
  && apt-get update -y \
  && apt-get upgrade -y \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    awscli \
    build-essential \
    ca-certificates \
    cmake \
    curl \
    git \
    gnupg \
    jq \
    libffi-dev \
    libssl-dev \
    lsb-release \
    postgresql-client-14 \
    python3 \
    python3-dev \
    python3-pip \
    python3-venv \
    sudo \
    tzdata

# Add NodeSource repo so we get Node 18.x, which is what we use in
# production, instead of whatever Ubuntu's default is at this time.
# https://github.com/nodesource/distributions#installation-instructions
RUN apt-get install --no-install-recommends -y ca-certificates curl gnupg \
  && mkdir -p /etc/apt/keyrings \
  && curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg \
  && echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_18.x nodistro main" | tee /etc/apt/sources.list.d/nodesource.list \
  && apt-get update \
  && apt-get install -y nodejs

# Add the Docker command line interface executable. Ubuntu packages it together
# with the Docker daemon, which we do not want to run. So we install it from
# Docker's own repository, which ships the CLI as a separate package.
RUN curl -fsSL https://download.docker.com/linux/ubuntu/gpg | \
    gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
  && echo >/etc/apt/sources.list.d/docker.list \
    "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  && apt-get update -y \
  && DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    docker-ce-cli

RUN adduser --disabled-password --gecos "" runner \
  && echo "runner ALL = (ALL) NOPASSWD: ALL" >/etc/sudoers.d/runner \
  && RUNNER_VERSION="$(curl -L -s -H 'Accept: application/json' https://github.com/actions/runner/releases/latest | jq -r .tag_name | sed 's/^v//')" \
  && echo "RUNNER_VERSION: $RUNNER_VERSION" \
  && su runner -lc "curl -O -L 'https://github.com/actions/runner/releases/download/v$RUNNER_VERSION/actions-runner-linux-x64-$RUNNER_VERSION.tar.gz' && tar xzf 'actions-runner-linux-x64-$RUNNER_VERSION.tar.gz'" \
  && DEBIAN_FRONTEND=noninteractive /home/runner/bin/installdependencies.sh \
  && DEBIAN_FRONTEND=noninteractive apt-get upgrade -y

COPY run-the-runner /usr/local/bin
RUN chmod a+x /usr/local/bin/run-the-runner

USER runner
SHELL ["/bin/bash", "-c"]

RUN cd \
  && mkdir -p .aws \
  && echo -e '[default]\nregion=eu-west-2\noutput=json' >.aws/config

CMD run-the-runner
