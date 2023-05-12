#!/bin/sh

export ROOT_CA_CERT_PATH=../../test/etcd_certs/host.cert

echo $ROOT_CA_CERT_PATH

mkdir -p test/etcd_certs/
openssl genrsa 2048 > test/etcd_certs/host.key
openssl req -new \
    -key test/etcd_certs/host.key \
    -out test/etcd_certs/host.csr \
    -subj '/CN=localhost/CN=127.0.0.1/CN=etcd'
openssl x509 -req \
    -days 365 \
    -in test/etcd_certs/host.csr \
    -signkey test/etcd_certs/host.key \
    -out test/etcd_certs/host.cert \
    -sha256 \
    -extfile test/openssl.ext
