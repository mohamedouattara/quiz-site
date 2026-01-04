Quiz site — Netlify deployment

This project is a static site (index.html, app.js, style.css). Below are quick ways to deploy it to Netlify.

1) Quick test locally

Run a simple static server (Python):

```bash
python -m http.server 3000
```

Open http://localhost:3000

2) Deploy using Netlify web UI (drag-and-drop)

- Zip the project folder or open the project folder in your system file explorer.
- Go to https://app.netlify.com/drop and drag the folder (or the zip) onto the page.

3) Deploy via Git (recommended for continuous deploy)

- Create a GitHub repo and push this project (see commands below).
- In Netlify, choose "New site from Git" and connect the GitHub repo. Set build command blank and publish directory `.`.

Commands to create a repo locally and push (replace <remote-url>):

```bash
git init
git add .
git commit -m "Prepare site for Netlify deployment"
# create remote on GitHub then:
git remote add origin <remote-url>
git branch -M main
git push -u origin main
```

4) Deploy via Netlify CLI (requires login)

```bash
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=.
```

Notes:
- A `netlify.toml` is included to publish from the project root and to handle SPA redirects.
- If you want, I can push to a GitHub repo for you (you'll need to provide remote URL or grant access), or I can run Netlify CLI deploy if you authenticate here.
