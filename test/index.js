var url = "../data.json";
fetch(url)
  .then(res => {
    return res.json()
  })
  .then((data)=>{

    console.log(data)
    data = data.data
    const list = Object.keys(data).map(i => {
      return data[i]
    })
    const houseInfo = list.map(i => {
      const item = i[0]
      return [item.latitude, item.longitude, null, item]
    })
    console.log(houseInfo)
    return houseInfo
  })
  .then(data => {
    const d = grade(data)
    console.log(d)
  })
  .catch(e => {
    console.log(e)
  })
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

  function average (list) {
    var sum = list.map(i => parseInt(i[3].average_price)).reduce((x,y) => {
      return x + y
    })
    return sum/list.length
  }
}
