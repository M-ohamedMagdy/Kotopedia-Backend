const cloudinary = require('cloudinary');
const { Promise } = require('mongoose');
cloudinary.config({
    cloud_name:'dzjcky6eb',
    api_key:'794354797246982',
    api_secret:'isWy-Lc6VVspSImIpLCqrjGDc10'
});

exports.uploads = (file) =>{
    return new Promise( resolve =>{
        cloudinary.uploader.upload(file,(result)=>{
            resolve({url:result.url,id:result.public_id})
        },{resource_type : "auto"})
    })
}