
module.exports = {
  AuthError: class extends Error {
    constructor(message) {
      super(message);
      this.name = 'AuthError';
    }
  },
};
