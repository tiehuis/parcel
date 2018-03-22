module.exports = import('./add.zig').then(function ({add}) {
  return add(2, 3);
});
