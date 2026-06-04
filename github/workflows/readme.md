

Developer Push → GitHub → CI Pipeline → Build → Test → Docker → Deploy → Production
     ↓              ↓          ↓         ↓       ↓        ↓         ↓          ↓
   git push    Webhook     Jenkins/   npm test  Docker   Push to   K8s/AWS   Live
                           GitHub    coverage  build    Registry  Deploy    Server
                           Actions









┌─────────────────────────────────────────────────────────────────────────────┐
│ CI/CD PIPELINE (GitHub Actions) │
├─────────────────────────────────────────────────────────────────────────────┤
│ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ 1. Code │───▶│ 2. Build │───▶│ 3. Test │───▶│ 4. Sonar │ │
│ │ Checkout│ │ & Lint │ │ & Cover │ │ Qube │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│ │ │ │ │ │
│ ▼ ▼ ▼ ▼ │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│ │ 5. Docker│───▶│ 6. Push │───▶│ 7. Deploy│───▶│ 8. Health│ │
│ │ Build │ │ Image │ │ to K8s │ │ Check │ │
│ └──────────┘ └──────────┘ └──────────┘ └──────────┘ │
│ │
└─────────────────────────────────────────────────────────────────────────────┘
│ │ │
▼ ▼ ▼
Docker Registry Kubernetes Cluster Production Server
(Docker Hub/ECR) (AWS EKS/GKE) (Live App)
