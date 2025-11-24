FROM ubuntu:22.04

ENV HADOOP_VERSION=3.3.6
ENV HADOOP_URL=https://dlcdn.apache.org/hadoop/common/hadoop-${HADOOP_VERSION}/hadoop-${HADOOP_VERSION}.tar.gz
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-arm64
ENV HADOOP_HOME=/opt/hadoop
ENV HADOOP_CONF_DIR=/opt/hadoop/etc/hadoop
ENV PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin

# Install basics + Java
RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    openjdk-11-jdk ssh rsync curl ca-certificates python3 python3-pip sudo \
 && rm -rf /var/lib/apt/lists/*

# Create hadoop user
RUN useradd -m -s /bin/bash hduser && echo "hduser:hdpassword" | chpasswd && adduser hduser sudo

WORKDIR /tmp

# Download and extract Hadoop
RUN curl -fSL -o hadoop.tar.gz ${HADOOP_URL} \
 && mkdir -p ${HADOOP_HOME} \
 && tar -xzf hadoop.tar.gz --strip-components=1 -C ${HADOOP_HOME} \
 && rm hadoop.tar.gz

# Create directories for HDFS storage and logs
RUN mkdir -p /hadoop_data/hdfs/namenode /hadoop_data/hdfs/datanode /hadoop_logs
RUN chown -R hduser:hduser /hadoop_data /hadoop_logs ${HADOOP_HOME}

# Copy config from build context
COPY hadoop_conf/ ${HADOOP_HOME}/etc/hadoop/
RUN chown -R hduser:hduser ${HADOOP_HOME}/etc/hadoop

# SSH setup for hduser
USER hduser
WORKDIR /home/hduser
RUN mkdir -p /home/hduser/.ssh && chmod 700 /home/hduser/.ssh

# Entrypoint script
COPY --chown=hduser:hduser docker-entrypoint.sh /home/hduser/docker-entrypoint.sh
RUN chmod +x /home/hduser/docker-entrypoint.sh

EXPOSE 9870 9864 9000 8088 8070 19888

ENTRYPOINT ["/home/hduser/docker-entrypoint.sh"]
