#!/bin/bash
# Download the AWS RDS/DocumentDB CA bundle to the expected path before app start
set -e
CA_PATH="/var/app/current/global-bundle.pem"
curl -sfL -o "$CA_PATH" "https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem"
chmod 644 "$CA_PATH"
echo "Downloaded DocumentDB CA bundle to $CA_PATH"
