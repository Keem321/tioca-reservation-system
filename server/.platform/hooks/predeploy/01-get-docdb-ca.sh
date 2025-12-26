#!/bin/bash
# Download the AWS RDS/DocumentDB CA bundle to the expected path before app start
set -e
CA_PATH="/etc/pki/docdb/global-bundle.pem"
CA_DIR="$(dirname $CA_PATH)"

if [ ! -d "$CA_DIR" ]; then
  mkdir -p "$CA_DIR"
fi

curl -sfL -o "$CA_PATH" "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"
chmod 644 "$CA_PATH"
echo "Downloaded DocumentDB CA bundle to $CA_PATH"
