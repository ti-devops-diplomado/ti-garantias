FROM jenkins/jenkins:2.541.2-jdk21

USER root

ENV DOTNET_ROOT=/usr/share/dotnet
ENV PATH="${PATH}:${DOTNET_ROOT}:${DOTNET_ROOT}/tools"

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        curl \
        docker-cli \
        docker-compose \
        git \
        gnupg \
        jq \
        nodejs \
        npm \
        unzip \
    && curl -sL https://aka.ms/InstallAzureCLIDeb | bash \
    && curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh \
    && bash /tmp/dotnet-install.sh --channel 8.0 --install-dir /usr/share/dotnet \
    && ln -sf /usr/share/dotnet/dotnet /usr/bin/dotnet \
    && curl -fsSL https://releases.hashicorp.com/terraform/1.11.4/terraform_1.11.4_linux_amd64.zip -o /tmp/terraform.zip \
    && unzip /tmp/terraform.zip -d /usr/local/bin \
    && chmod +x /usr/local/bin/terraform \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/dotnet-install.sh /tmp/terraform.zip

COPY deploy/jenkins/plugins.txt /usr/share/jenkins/ref/plugins.txt

RUN jenkins-plugin-cli --plugin-file /usr/share/jenkins/ref/plugins.txt

USER jenkins
