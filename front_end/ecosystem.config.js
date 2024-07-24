module.exports = {
    apps: [
      {
        name: "front-end-app",
        script: "npm",
        args: "start",
        env: {
          NODE_ENV: "production",
          PORT: 3000 
        }
      }
    ]
  };
  