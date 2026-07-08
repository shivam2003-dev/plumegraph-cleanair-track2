# VayuLens GCP Deployment

VayuLens runs in the shared LokSetu GKE cluster through Argo CD.

- Host: `vayulens.shivam2003.com`
- GCP project: `project-72558650-faf6-4529-a05`
- Cluster: `loksetu` in `us-east4`
- Namespace: `vayulens`
- Artifact Registry image: `us-east4-docker.pkg.dev/project-72558650-faf6-4529-a05/people-priority/vayulens`
- Argo CD app: `vayulens-gcp`

Every push to `main` runs `.github/workflows/gcp-cd.yml`, builds and pushes a new immutable image, commits that image tag into `deploy/k8s/deployment.yaml`, and refreshes the Argo CD application.
