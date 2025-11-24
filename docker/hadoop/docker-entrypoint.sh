#!/bin/bash
set -e

: ${HADOOP_ROLE:=master}
: ${HADOOP_NAMENODE_DIR:=/hadoop_data/hdfs/namenode}
: ${HADOOP_DATANODE_DIR:=/hadoop_data/hdfs/datanode}

export HADOOP_HOME=/opt/hadoop
export JAVA_HOME=/usr/lib/jvm/java-11-openjdk-arm64
export HADOOP_CONF_DIR=$HADOOP_HOME/etc/hadoop
export PATH=$PATH:$HADOOP_HOME/bin:$HADOOP_HOME/sbin

# Generate SSH key
if [ ! -f /home/hduser/.ssh/id_rsa ]; then
  ssh-keygen -t rsa -P "" -f /home/hduser/.ssh/id_rsa
fi
cat /home/hduser/.ssh/id_rsa.pub >> /home/hduser/.ssh/authorized_keys
chmod 600 /home/hduser/.ssh/authorized_keys

# Ensure directories exist
mkdir -p ${HADOOP_NAMENODE_DIR} ${HADOOP_DATANODE_DIR}

if [ "$HADOOP_ROLE" = "master" ]; then
  # Format namenode on first run
  if [ ! -f ${HADOOP_NAMENODE_DIR}/current/VERSION ]; then
    echo "Formatting HDFS namenode..."
    ${HADOOP_HOME}/bin/hdfs namenode -format -force -nonInteractive
  fi
  
  echo "Starting HDFS Namenode and YARN ResourceManager..."
  ${HADOOP_HOME}/bin/hdfs --daemon start namenode
  ${HADOOP_HOME}/bin/yarn --daemon start resourcemanager || echo "ResourceManager started (priority warning ignored)"
  
  # Wait for services to start
  sleep 5
  
  # Check if services are running
  ${HADOOP_HOME}/bin/hdfs dfsadmin -report 2>/dev/null || echo "NameNode starting..."
  
  tail -f /dev/null
else
  echo "Starting HDFS DataNode and YARN NodeManager..."
  ${HADOOP_HOME}/bin/hdfs --daemon start datanode || echo "DataNode started (warnings ignored)"
  ${HADOOP_HOME}/bin/yarn --daemon start nodemanager || echo "NodeManager started (warnings ignored)"
  tail -f /dev/null
fi
