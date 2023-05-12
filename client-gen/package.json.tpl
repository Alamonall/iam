{
  "version": "${CI_COMMIT_TAG}",
  "name": "iam-service-api-client",
  "description": "",
  "main": "dist/index.js",
  "license": "UNLICENSED",
  "scripts": {
    "build": "tsc -p tsconfig.json"
  },
  "devDependencies": {
    "typescript": "^4.7.3"
  },
  "dependencies": {
    "axios": "^0.27.2"
  },
  "files": [
    "dist/"
  ] 
}
