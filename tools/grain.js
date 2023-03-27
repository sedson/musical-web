function granulate (track, options) {
  if (!track.ready) { return; }

  const buffer = track.buffer;
  console.log(buffer);
}