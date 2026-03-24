export function enterFullscreen() {
  const el = document.documentElement;
  const rfs =
    el.requestFullscreen ||
    el.webkitRequestFullscreen ||
    el.mozRequestFullScreen ||
    el.msRequestFullscreen;
  if (rfs) rfs.call(el);
}

export function exitFullscreen() {
  const efs =
    document.exitFullscreen ||
    document.webkitExitFullscreen ||
    document.mozCancelFullScreen ||
    document.msExitFullscreen;
  if (efs && document.fullscreenElement) efs.call(document);
}
