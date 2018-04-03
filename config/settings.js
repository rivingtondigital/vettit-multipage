if(process.env.APP_STAGE){
  switch(process.env.APP_STAGE){
    case 'prod':
      exports.domain = "www.volunteercheck.org";
      exports.protocol = "https://";
      break;

    case 'stage':
      exports.domain = "vettit-dev.com";
      exports.protocol = "http://";
      break;

    case 'dev':
      exports.domain = "a.vettit";
      exports.protocol = "http://";
      break;

    default:
      exports.domain = "localhost";
      exports.protocol = "http://";
  }
}else{
  throw new Error("You must set the APP_STAGE env variable for initialization to work.");
}


