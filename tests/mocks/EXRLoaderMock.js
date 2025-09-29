class EXRLoader {
  load(path, onLoad, onProgress, onError) {
    // Immediately invoke onLoad with a stub texture object
    const texture = { minFilter: 9728, magFilter: 9728, generateMipmaps: false };
    if (onLoad) setTimeout(() => onLoad(texture), 0);
  }
}
module.exports = { EXRLoader };
