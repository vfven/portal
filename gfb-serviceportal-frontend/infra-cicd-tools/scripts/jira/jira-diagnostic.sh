#!/bin/bash
# debug-completo.sh

set -Eeuo pipefail

UTILS_DIR="$(cd "/opt/atlassian/pipelines/agent/build/infra-cicd-tools/scripts/" && pwd)"
source "$UTILS_DIR/utils/logging.sh"
source "$UTILS_DIR/utils/error-handling.sh"
source "$UTILS_DIR/utils/utils.sh"
source "$UTILS_DIR/jira/jira-comment-utils.sh"
source "$UTILS_DIR/security/hashicorp-vars.sh"

init_utilities

#!/bin/bash
# debug-simple.sh

#!/bin/bash
# discover-all-issues.sh

echo "=== DESCUBRIENDO TODAS LAS SUBTAREAS EN EL RELEASE ==="

jql_query="project = DV AND fixVersion = \"app-source-code v1.0.0\" AND issuetype = Sub-task"
encoded_jql=$(echo "$jql_query" | jq -s -R -r @uri)

curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
  -X GET \
  "$JIRA_BASE_URL/rest/api/3/search/jql?jql=$encoded_jql&maxResults=50&fields=key,summary,issuetype" \
  | jq -r '.issues[] | "\(.key) - \(.fields.summary)"'

echo ""
echo "=== TODAS LAS SUBTAREAS EN EL PROYECTO ==="

jql_query="project = DV AND issuetype = Sub-task"
encoded_jql=$(echo "$jql_query" | jq -s -R -r @uri)

curl -s -u "$JIRA_USERNAME:$JIRA_API_TOKEN" \
  -X GET \
  "$JIRA_BASE_URL/rest/api/3/search/jql?jql=$encoded_jql&maxResults=100&fields=key,summary,fixVersions" \
  | jq -r '.issues[] | "\(.key) - \(.fields.summary) - Version: \(.fields.fixVersions[0].name // "None")"'