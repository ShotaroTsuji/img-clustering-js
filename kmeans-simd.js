onmessage = function(e) {
  var result = kmeans(e.data[0], e.data[1], e.data[2]);

  postMessage(result);
};


function getRandomInt(min, max)
{
  return Math.floor( Math.random() * (max - min + 1) ) + min;
}

function getPixelVector(img, index)
{
  return SIMD.Float32x4(img.data[index*4+0], img.data[index*4+1], img.data[index*4+2], img.data[index*4+3]);
}

function addVector(u, v)
{
  return SIMD.Float32x4.add(u, v);
}

function scaleVector(c, v)
{
  var cv = SIMD.Float32x4.splat(c);
  return SIMD.Float32x4.mul(cv, v);
}

function euclideanDistance(u, v)
{
  var q = SIMD.Float32x4.sub(u, v);
  var r = SIMD.Float32x4.mul(q, q);
  var a = new Float32Array(4);
  SIMD.Float32x4.store(a, 0, r);
  return Math.sqrt(a[0]+a[1]+a[2]+a[3]);
}


function kmeans(src, dst, k)
{
  var centroids = new Array(k); /* represented by vector */
  var N = src.width*src.height;
  var assignments = new Array(N); /* represented by cluster index */
  var points = new Array(N);

  for( var i = 0 ; i < N ; i++ )
  {
//    points[i] = SIMD.Float32x4.load(src.data, i*4);
    points[i] = getPixelVector(src, i);
  }

  /* Initial centroids */
  for( var j = 0 ; j < k ; j++ )
  {
    centroids[j] = points[getRandomInt(0, N-1)];
  }

//  console.log(centroids[0], centroids[1]);

  for( var iter = 0 ; iter < 50 ; iter++ )
  {
    /* assignment */
    var num_changed = 0;
    for( var i = 0 ; i < N ; i++ )
    {
      var min_dist = 100000000;
      var min_index = 0;
      for( var j = 0 ; j < k ; j++ )
      {
        var d = euclideanDistance(points[i], centroids[j]);
        if( d < min_dist )
        {
          min_dist = d;
	  min_index = j;
        }
      }
      if( assignments[i] != min_index ) num_changed++;
      assignments[i] = min_index;
    }
//    console.log("Num changed", num_changed);

    if( num_changed == 0 ) break;

    /* cluster update */
    var sums = new Array(k);
    var num_elements = new Array(k);
    for( var j = 0 ; j < k ; j++ )
    {
      sums[j] = SIMD.Float32x4(0, 0, 0, 0);
      num_elements[j] = 0;
    }
    for( var i = 0 ; i < N ; i++ )
    {
      var j = assignments[i];
      sums[j] = addVector(points[i], sums[j]);
      num_elements[j]++;
    }
    for( var j = 0 ; j < k ; j++ )
    {
      centroids[j] = scaleVector(1.0/num_elements[j], sums[j]);
    }
    /*
    for( var j = 0 ; j < k ; j++ )
    {
      var sum = SIMD.Float32x4(0, 0, 0, 0);
      var num_elements = 0;

      for( var i = 0 ; i < N ; i++ )
      {
        if( assignments[i] != j ) continue;

        sum = addVector(points[i], sum);
        num_elements++;
      }

      centroids[j] = scaleVector(1.0/num_elements, sum);
    }
    */

//    console.log(centroids[0], centroids[1]);
  }

  /* floor centroids */
  for( var j = 0 ; j < k ; j++ )
  {
    SIMD.Float32x4.replaceLane(centroids[j], 0,
      Math.floor(SIMD.Float32x4.extractLane(centroids[j], 0)));
    SIMD.Float32x4.replaceLane(centroids[j], 1,
      Math.floor(SIMD.Float32x4.extractLane(centroids[j], 1)));
    SIMD.Float32x4.replaceLane(centroids[j], 2,
      Math.floor(SIMD.Float32x4.extractLane(centroids[j], 2)));
    SIMD.Float32x4.replaceLane(centroids[j], 3,
      Math.floor(SIMD.Float32x4.extractLane(centroids[j], 3)));
  }
//  console.log(centroids[0], centroids[1]);

  /* color assignemnt */
  for( var i = 0 ; i < N ; i++ )
  {
    var pixel = centroids[assignments[i]];

    dst.data[i*4+0] = SIMD.Float32x4.extractLane(pixel, 0);
    dst.data[i*4+1] = SIMD.Float32x4.extractLane(pixel, 1);
    dst.data[i*4+2] = SIMD.Float32x4.extractLane(pixel, 2);
    dst.data[i*4+3] = SIMD.Float32x4.extractLane(pixel, 3);
  }

  return dst;
}
