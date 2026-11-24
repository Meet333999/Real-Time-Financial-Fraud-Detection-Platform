# Hugging Face Spaces Deployment Guide (Permanent Portfolio Link)

This guide walks you through deploying the complete Real-Time Financial Fraud Detection Platform to **Hugging Face Spaces** for **FREE** with **16 GB RAM and 2 vCPUs**.

Once deployed, you will get a permanent public URL like:
`https://huggingface.co/spaces/<your-username>/financial-fraud-detection`
or direct webview link:
`https://<your-username>-financial-fraud-detection.hf.space`

---

## Prerequisites
- A free Hugging Face account at [https://huggingface.co](https://huggingface.co).
- Git installed on your machine.

---

## Step 1: Create a New Space on Hugging Face

1. Go to [https://huggingface.co/new-space](https://huggingface.co/new-space).
2. Fill in the Space settings:
   - **Space name**: `financial-fraud-detection` (or your preferred name)
   - **License**: `mit`
   - **Select the Space SDK**: Click **Docker**
   - **Docker template**: Choose **Blank**
   - **Space hardware**: Select **CPU basic • 2 vCPU • 16 GB • Free**
   - **Visibility**: **Public**
3. Click **Create Space**.

---

## Step 2: Push Your Project to Hugging Face

Hugging Face Spaces are standard Git repositories. You can clone your newly created space and push this project into it:

```bash
# 1. Initialize git in your local project folder if not already done:
cd "c:\Projects\Internship\New folder"
git init
git add .
git commit -m "feat: complete real-time financial fraud detection platform"

# 2. Add your Hugging Face Space as a git remote:
# (Replace <YOUR_HF_USERNAME> and <YOUR_SPACE_NAME> with your actual details)
git remote add space https://huggingface.co/spaces/<YOUR_HF_USERNAME>/<YOUR_SPACE_NAME>

# 3. Push to Hugging Face:
git push --force space main
```

*(When prompted for credentials, use your Hugging Face username and your **Hugging Face Access Token** with "Write" permissions from [https://huggingface.co/settings/tokens](https://huggingface.co/settings/tokens) as the password).*

---

## Step 3: Watch Build & Access Your Live Platform

1. Go to your Space page on Hugging Face.
2. Under the **"Building"** tab, you will see Docker building the image using the provided `Dockerfile`.
3. Once the build finishes (takes ~2-3 minutes), the status turns to **"Running"**.
4. The full React Analyst Dashboard with real-time WebSocket live monitoring, XGBoost, GNN scoring, and interactive graph exploration will be live right in your browser!

---

## Alternative: Direct Web UI Upload (No Git CLI Needed)

If you prefer not using Git command line:
1. In your newly created Hugging Face Space, click the **"Files"** tab $\to$ **"Add file"** $\to$ **"Upload files"**.
2. Drag and drop the following files/folders from your project folder:
   - `Dockerfile`
   - `requirements.txt`
   - `backend/`
   - `artifacts/`
   - `data/`
   - `frontend/dist/`
   - `fraud_detection.db`
3. Commit changes. Hugging Face will automatically build and launch the container.
