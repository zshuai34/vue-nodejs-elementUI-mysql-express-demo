var {verifyToken} = require('../../model/jwt')

// 实现与mysql交互 使用连接池，提升性能
var {pool} = require('../../model/connDb');

module.exports = {
  //  用户列表
  userList: function (req, res, next) {
    var token=req.headers.sessiontoken // 获取前端请求头发送过来的tokenid
    let reqJson = JSON.parse(req.body.req)
    let username = reqJson.username.replace(/(^\s*)|(\s*$)/g, "") // 去掉首位空格
    let name = reqJson.name.replace(/(^\s*)|(\s*$)/g, "")
    let pageSize = reqJson.pageSize
    let pageNo = reqJson.pageNo
    
    if (token) {
      try {
        // 校验token decode指解码后的信息
        let decode = verifyToken(token)
        var $sql = 'select id,username,name,login_date from user where INSTR(username, ?) and INSTR(name, ?) and if_deleted = 0 LIMIT ?, ?';
        var $sqlCount = 'SELECT COUNT(*) as totalCount from user where INSTR(username, ?) and INSTR(name, ?) and if_deleted = 0'
        pool.getConnection(function(err, connection){
          if (err) {
            return res.send({success: false, msg: err.message, retcode: 400})
          }
          connection.query($sql, [username, name, (pageNo-1) * pageSize, pageSize], function(err, resultList){
            if (err) {
              return res.send({success: false, msg: err.message, retcode: 400})
            }
            connection.query($sqlCount, [username, name], function(err, total){
              if (err) {
                return res.send({success: false, msg: err.message, retcode: 400})
              }
              res.json({
                userList: resultList,
                totalCount: total[0].totalCount,
                retcode: 200
              })
            })
          })
          connection.release(); // 释放连接
        })
      } catch {
        return res.send({success: false, msg: 'token超时，校验失败', retcode: 1001})
      }
    } else {
      res.send({
        msg: '未登录,跳转登录',
        retcode: 1001
      })
    }
  },

  // 用户信息
  user_info: function(req,res,next) {
    var token=req.headers.sessiontoken // 获取前端请求头发送过来的tokenid
    let reqJson = JSON.parse(req.body.req)
    let userId = reqJson.userId.replace(/(^\s*)|(\s*$)/g, "") // 去掉首位空格
  
    if (token) {
      if (userId === undefined || userId === '') {
        res.send({success: true, msg: '未登录，无用户信息', retcode: 2001})
      }else {
        try {
          // 校验token decode指解码后的信息
          let decode = verifyToken(token)
          var $sql = 'select id,username,name,login_date from user where id = ? and if_deleted = 0';
          pool.getConnection(function(err, connection){
            if (err) {
              return res.send({success: false, msg: err.message, retcode: 400})
            }
            connection.query($sql, [userId], function(err, resultList){
              if (err) {
                return res.send({success: false, msg: err.message, retcode: 400})
              }
              res.json({
                userInfo: resultList[0],
                retcode: 200
              })
            })
            connection.release(); // 释放连接
          })
        } catch {
          return res.send({success: false, msg: 'token超时，校验失败', retcode: 1001})
        }
      }
    } else {
      res.send({
        msg: '未登录,跳转登录',
        retcode: 1001
      })
    }
  } 
}