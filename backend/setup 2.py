from setuptools import setup, find_packages

setup(
    name="year-calendar",
    version="0.1.0",
    packages=find_packages(),
    install_requires=[
        "fastapi==0.109.0",
        "uvicorn==0.27.0",
        "python-dotenv==1.0.0",
        "google-auth==2.27.0",
        "google-auth-oauthlib==1.2.0",
        "google-auth-httplib2==0.2.0",
        "google-api-python-client==2.116.0",
        "httpx==0.26.0",
        "python-jose==3.3.0",
        "pydantic==2.5.3",
        "pydantic-settings==2.1.0",
    ],
) 