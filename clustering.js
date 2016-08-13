onmessage = function(e) {
  console.log(e.data);
  segment_image(e.data.originalImage, e.data.resultImage, e.data.numClusters);
};

function segment_image(src, dst, k)
{
  var worker = new Worker("kmedoids.js");

  worker.postMessage({image:src, k: k, maxiter: 10});

  worker.onmessage = function(e)
  {
    if( e.data.msg == 'result' )
    {
      var clusters = e.data.data;

      for( var j = 0 ; j < k ; j++ )
      {
        for( var i = 0 ; i < clusters[j].indices.length ; i++ )
        {
          var medoid = clusters[j].medoid;
          var index = clusters[j].indices[i];

          dst.data[index*4+0] = src.data[medoid*4+0];
          dst.data[index*4+1] = src.data[medoid*4+1];
          dst.data[index*4+2] = src.data[medoid*4+2];
          dst.data[index*4+3] = src.data[medoid*4+3];
        }
      }

      postMessage({msg: 'result', resultImage:dst});
    }
    else if( e.data.msg == 'progress' )
    {
      postMessage(e.data);
    }
  }
}

function l1Distance(u, v)
{
  return  Math.abs(u[0]-v[0])
	+ Math.abs(u[1]-v[1])
	+ Math.abs(u[2]-v[2])
	+ Math.abs(u[3]-v[3]);
}

function innerProd(u, v)
{
  return u[0]*v[0] + u[1]*v[1] + u[2]*v[2] + u[3]*v[3];
}

function vectorNorm(u)
{
  return Math.sqrt(innerProd(u, u));
}

function projDistance(u, v)
{
/*
  console.log("u = ", u, ", v = ", v);
  console.log("(u, v) = ", innerProd(u, v));
  console.log("|u||v| = ", vectorNorm(u)*vectorNorm(v));
*/
  var prod = innerProd(u, v);
  var scale = vectorNorm(u)*vectorNorm(v);
  var cosT = innerProd(u,v)/(vectorNorm(u)*vectorNorm(v));

  return Math.acos(cosT);
}

