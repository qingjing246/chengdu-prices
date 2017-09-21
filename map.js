var map = new BMap.Map("map", {});                        // 创建Map实例
map.centerAndZoom(new BMap.Point(104.0712, 30.5762), 12);     // 初始化地图,设置中心点坐标和地图级别
//map.enableScrollWheelZoom();                            //启用滚轮放大缩小
if (document.createElement('canvas').getContext) {
  var  mapStyle ={ 
    features: ["road", "building","water","land"],//隐藏地图上的poi
    style : "dark"  //设置地图风格为高端黑
  }
  map.setMapStyle(mapStyle);

  var BW            = 0,    //canvas width
    BH            = 0,    //canvas height
    ctx           = null,
    stars         = [],   //存储所有星星对象的数组
    timer         = null, //定时器
    timeLine      = null, //时间轴对象
    rs            = [],   //最新的结果
    isNowTimeData = true, //是否显示当前时间的定位情况
    py            = null, //偏移
    gridWidth     = 10000,//网格的大小
    isOverlay     = false,//是否叠加
    //gridWidth   = 1,//网格的大小
    canvas        = null; //偏移
var rawData = []

  function Star(options){
    this.init(options);
  }

  Star.prototype.init = function(options) {
    this.x   = ~~(options.x);
    this.y   = ~~(options.y);
    this.level   = ~~(options.level);
    this.initSize(options.size);
    if (~~(0.5 + Math.random() * 7) == 1) {
      this.size = 0;
    } else {
      this.size = this.maxSize;
    }
  }

  Star.prototype.initSize = function(size) {
    var size = ~~(size);
    this.maxSize = size > 6 ? 6 : size;
  }

  Star.prototype.render = function(i) {
    var p = this;

    if(p.x < 0 || p.y <0 || p.x > BW || p.y > BH) {
      return;
    }

    ctx.beginPath();
    var gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);

    var colors = colors(p.level);
    gradient.addColorStop(0,colors[0]);
    gradient.addColorStop(1,colors[1]);

    ctx.fillStyle = gradient;
    ctx.arc(p.x, p.y, p.size, Math.PI*2, false);
    ctx.fill();
    if (~~(0.5 + Math.random() * 7) == 1) {
      p.size = 0;
    } else {
      p.size = p.maxSize;
    }

    function colors (level) {
      switch(level){
        case 300:
          return  [ "rgba(250,120,249,1)", "rgba(250,120,249,0.3)"]
        case 100:
          return  [ "rgba(7,250,249,1)", "rgba(7,250,249,0.3)"]
        default:
          return  [ "rgba(7,120,249,1)", "rgba(7,120,249,0.3)"]
      }
    }

  }

  function render(){
    renderAction();
    setTimeout(render, 180);
  }

  function renderAction() {
    ctx.clearRect(0, 0, BW, BH);
    ctx.globalCompositeOperation = "lighter";
    for(var i = 0, len = stars.length; i < len; ++i){
      if (stars[i]) {
        stars[i].render(i);
      }
    }
  }


  // 复杂的自定义覆盖物
  function ComplexCustomOverlay(point){
    this._point = point;
  }
  ComplexCustomOverlay.prototype = new BMap.Overlay();
  ComplexCustomOverlay.prototype.initialize = function(map){
    this._map = map;
    canvas = this.canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;left:0;top:0;";
    ctx = canvas.getContext("2d");
    var size = map.getSize();
    canvas.width = BW = size.width;
    canvas.height = BH = size.height;
    map.getPanes().labelPane.appendChild(canvas);
    //map.getContainer().appendChild(canvas);
    //


    //return this.canvas;
  }
  ComplexCustomOverlay.prototype.draw = function(){
    var map = this._map;
    var bounds = map.getBounds();
    var sw = bounds.getSouthWest();
    var ne = bounds.getNorthEast();
    //draw star
    var pixel = map.pointToOverlayPixel(new BMap.Point(sw.lng, ne.lat));
    py = pixel;
    if (rs.length > 0) {
      showStars(rs);
    }

      //var pixel = map.pointToOverlayPixel(this._point);
  }
  var myCompOverlay = new ComplexCustomOverlay(new BMap.Point(116.407845,39.914101));
  map.addOverlay(myCompOverlay);

  var project = map.getMapType().getProjection();
  var bounds = map.getBounds();
  var sw = bounds.getSouthWest();
  var ne = bounds.getNorthEast();
  sw = project.lngLatToPoint(new BMap.Point(sw.lng, sw.lat));
  ne = project.lngLatToPoint(new BMap.Point(ne.lng, ne.lat));

  //左上角墨卡托坐标点
  var original = {
    x : sw.x,
    y : ne.y
  }

  //get data
  function fetchData  (cb) {
    var url = "./data.json";
    fetch(url)
      .then(res => {
        return res.json()
      })
      .then((data)=>{
        data = data.data
        const list = Object.keys(data).map(i => {
          return data[i]
        })
        const houseInfo = list.map(i => {
          const item = i[0]
          return [item.latitude, item.longitude,100, item]
        })
        rawData = houseInfo
        return houseInfo
      })
      .then(d => grade(d))
      .then(data => {
        showStars(data)
        cb()
      })
      .catch(e => {
        console.error(e)
      })
  }
  function grade (data) {
    var average1 = average(data)
    var average2 = average(data.filter(i => i[3].average_price > average1))
    var average3 = average(data.filter(i => i[3].average_price < average1))

    return data.map(i => {
      if(i[3].average_price > average2){
        i[2] = 300
      }else if(i[3].average_price < average3){
        i[2] = 100
      }else{
        i[2] = 200
      }
      return i
    }) 
  }
  function average (list) {
    var sum = list.map(i => parseInt(i[3].average_price)).reduce((x,y) => {
      return x + y
    })
    return sum/list.length
  }
    //显示星星
    function showStars(rs) {
      stars.length = 0;
      var temp = {};
      for (var i = 0, len = rs.length; i < len; i++) {
        var item = rs[i];
        var addNum = gridWidth / 2;
        var x = item[0] * gridWidth + addNum;
        var y = item[1] * gridWidth + addNum;
        var point = {lat:item[0], lng:item[1]}
        var px = map.pointToOverlayPixel(point);
        //create all stars
        var s = new Star({
          x: px.x - py.x, 
          y: px.y - py.y,
          size: item[2],
          level: item[2]
        });
        stars.push(s);
        //}
      }
      canvas.style.left = py.x + "px";
      canvas.style.top = py.y + "px";
      renderAction();
    }

    render();

    function nowTimeCbk (time) {
      fetchData(function () {
        if (isNowTimeData) {
          setTimeout(function(){
            if (isNowTimeData) {
              startCbk(nowTimeCbk);
   myCompOverlay = new ComplexCustomOverlay(new BMap.Point(116.407845,39.914101));
            }
          }, 1000);
        }
      })
    }
    function startCbk(cbk){
      
      var now = new Date();
      var time = {
        hour   : now.getHours(),
        minute : now.getMinutes(),
        second : now.getSeconds()
      };
      if (cbk) {
        cbk(time);
      }
    };
    startCbk(nowTimeCbk);
  } else {
    alert('请在chrome、safari、IE8+以上浏览器查看本示例');
  }
//map.addEventListener("click",function(e){
  //rawData.find(i => {
    //if(mostlyEqual(e.point.lng,i[1]) && mostlyEqual(e.point.lat, i[0])){
      //console.log(true)
    //}
  //})

//});
function mostlyEqual (a,b) {
  console.log(a -b)
  return Math.abs(a - b) < 0.001 
}
function creatEle (top,left) {

  var div =  document.createElement("div");
      div.className = "testaa"
      div.style.position = "absolute";
      div.style.left = top + "px";
      div.style.top  = left + "px";
      //div.style.zIndex = BMap.Overlay.getZIndex(this._point.lat);
      div.style.backgroundColor = "#EE5D5B";
      div.style.border = "1px solid #BC3B3A";
      div.style.color = "white";
      div.style.height = "18px";
      div.style.padding = "2px";
      div.style.lineHeight = "18px";
      div.style.whiteSpace = "nowrap";
      div.style.MozUserSelect = "none";
      div.style.fontSize = "12px";
      div.style.visibility = "hidden";
     
      div.onmouseover = function(){
        div.style.visibility = "visible";
        div.innerHTML = "tset"
        //this.getElementsByTagName("span")[0].innerHTML = that._overText;
      }

      div.onmouseout = function(){
        div.style.visibility = "hidden";
        //this.getElementsByTagName("span")[0].innerHTML = that._text;
      }
      return div;
}
