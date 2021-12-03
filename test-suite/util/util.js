function err(msg) {
  return "Error: " + msg + "\n"
}
function areEqualShallow(a, b) {
  for (var key in a) {
    if (!(key in b) || a[key] !== b[key]) {
      return false;
    }
  }
  for (var key in b) {
    if (!(key in a) || a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}
function allPropsEqual(a, b) {
  for (var key in a) {
    if ((key in b) && a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

module.exports = {
  allPropsEqual,
  areEqualShallow,
  err
}