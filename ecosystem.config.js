module.exports = {
  apps : [{
    name   : "ORLAU_TOOLKIT",
    script : "./bin/www",
    env_production: {
      NODE_ENV: "production"
   },
   env_development: {
      NODE_ENV: "development"
   }
  }]
}
