function login(user) {
  const API_KEY = process.env.API_KEY;
  const log = (message) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(message);
    }
  }

  if (user === null) {
    log('User is null');
    return false;
  }

  return true;
}