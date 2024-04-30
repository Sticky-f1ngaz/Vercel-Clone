
echo "Inside main.sh"
export GIT_REPO_URL="$GIT_REPO_URL"
git clone "$GIT_REPO_URL" /home/app/output
exec node script.js