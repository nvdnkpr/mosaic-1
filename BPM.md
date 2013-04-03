# Brix Package Manager 设计与实现

义宇的邮件偏重开发目标，没有讲到具体的实现细节。我僭越一下，基于这个马赛克客户端演示，讨论下思路。

## 目标

当然，讨论之前，我们先把木头的要求明确一下。

客户端基本要求：

- 组件的发布（publish）与下载（install）
- 组件的初始化（init）

服务端基本要求：

- 命名空间列表
- 组件列表
- 组件演示查看

也很重要，但相对前面几个稍微次要一点点的功能点

- 组件 extension 支持
- 用户验证引入 [BUC](http://docs.alibaba-inc.com/display/RC/Buc+SSO+USER+GUIDE)，支持域账号登陆

以上，即 BPM 上半年亟需解决的所有问题。

## 设计

义宇的邮件里，也同意了我之前的一个建议，服务端换掉，摆脱 CouchDB 那一套。

### 服务端

为实现前述目标，服务端需要支持如下接口：

#### 发布组件

POST 请求：

```js
app.post('/api/:namespace/:component/:version')

// 参数类似
{
    tarball: ... // 压缩包
}

// 返回：成功
// 201
{
    success: 'created!'
}

// 返回：失败
// 422
{
    error: 'exists!'
}
```

tarball 的内容为一个压缩包，压缩包的接口见下文。

#### 下载组件

GET 请求：

```js
app.get('/api/:namespace/:component/:version')

// 返回 package.tgz 文件
```

package.tgz 内容，即它解压开来的样子，如下：

```
package
├── data.json
├── index.js
├── index.scss
├── package.json
├── template.html
└── template.vm
```

也可以不指定版本号，下载最新的组件版本，忽略 `:version` 参数，或者传 `latest` 即可。

#### 用户验证

GET 请求：

```js
app.get('/auth')
```

将使用 BUC SSO 功能验证账户，如果未登录，则跳转至登录页，此处需要客户端妥善处理，提醒用户填写域账号，
再重新提交到服务端，由服务端做进一步判断。验证成功之后，创建一个授权代号，存放在用户家目录下，类似
`~/.bpm/`，具体的目录设计，容后再谈。

#### 自身功能

除了上边与客户端打交道的几个必要接口之外，服务端还需要实现：

```js
// 查看命名空间，和其下所有组件
app.get('/:namespace')

// 查看组件信息，和其所有历史版本，此处显示最新版本的预览
app.get('/:namespace/:component')

// 查看组件版本详情
app.get('/:namespace/:component/:version')
```

#### 实现方案

在此前的 mosaic-server 演示项目中，以上功能要求，我已经实现了主要部分。因此，此次更新 BPM，
我决定沿用这套方案，使用 NodeJS 做后端开发技术，express 作为 Web 开发框架，在其基础上完成 BPM
服务端开发。

预计完成以上所有功能的工时：5-10 个工作日。

### 客户端

#### bpmrc 或者说 ~/.bpm

客户端也涉及到一些临时数据、用户配置的存储，它不属于任何实际的项目，也不应在实际项目中产生多余的文件。
我设想的此类存放结构如下：

```
~/.bpm
├── cache     # 目录，存放缓存的 package.tgz 压缩包
├── cookie    # 用户的 cookie jar，存放用户在服务端的会话 ID 或者验证信息
└── config    # ini 文件，存放用户配置，详情见下文
```

针对这两项功能，bpm 客户端需要提供两个主要命令：

- 缓存（bpm-cache)
- 配置（bpm-config）

类似：

```bash
# 清除缓存
bpm cache clean

# 列出缓存内容
bpm cache ls

# 配置源服务器地址
bpm config source http://githop.etao.net

# 配置用户信息
bpm config user.name yicai.cyj
bpm config user.email yicai.cyj@taobao.com

# 输出配置信息
bpm config user.name     # ==> yicai.cyj
```

这一块功能，现有的 BPM 有所实现，但没有罗列清楚，请义宇补充一下。另外，SPM 那边包装了个
[spmrc](https://github.com/spmjs/spmrc) ，我觉得挺有指导意义，不妨参考。

#### 初始化组件

为了快速初始化一个空白组件，让用户上手，我们需要初始化的结构如下：

```
new-component
├── data.json      # 示例数据
├── index.js       # JavaScript 入口
├── index.scss     # CSS 入口
├── package.json   # 组件描述
└── template.html  # 组件模板
```

其下有 JavaScript、CSS 的入口文件，有该组件的描述，有模板文件和示例数据文件。

在这些文件中，如下文件需要提供一份用于初始化的模板：

- index.js
- index.scss
- package.json

index.js 的模板类似：

```js
/**
 * @author: :user.name
 */
KISSY.add(':namespace/:component/index', function(S) {
    // insert your code here
})
```

index.scss 的模板类似：

```scss
/**
 * @author: :user.name
 */
.:namespace-:component {
  // insert your code here
}
```

package.json 则要复杂一些，容后讨论。初始版本号为 0.1.0 。

#### 用户验证

这里的实现方式我还不确定，容后细化。

大致的思路是，通过请求服务端 /auth 地址来验证账号。平常的发布、下载操作，需要带上 cookie 信息，
如果 cookie 失效，即跳转到 /auth 验证，成功后存储验证信息到 cookie 中。

#### package.json

我们参考 [npm](http://package.json.nodejitsu.com/) 和 component.io 的 package.json，
同时以满足自身使用为首要目标，我设想的 package.json 如下：

```json
{
    "name": "ceiling",
    "version": "0.1.0",
    "author": "逸才 <yicai.cyj@taobao.com>",
    "description": "吊顶",
    "contributors": [
        {
            "name": "凌征",
            "email": "lingzheng.yh@taobao.com"
        }
    ],
    // 包含的 JavaScript 文件
    "scripts": ["index.js"],
    "dependencies": {
        "button": "*",
        "menu"  : "~1.0.0"
    },
    "ui": {
        "width": "400",
        "height": "200"  // 自适应的话，不写即可
    }
}
```

`dependencies` 对象，可以用来指定当前项目或者组件的依赖，在含有 `package.json` 文件的目录中，
可以直接执行 `bpm install`，会读取这份文件中的依赖列表，根据指定的版本安装。

当然，这只是我设想的一个稍微贴心、靠近 npm 的一个功能。

`scripts` 数组需要解释一下，这里的概念与 component.io 里的是一样的，用来说明当前组件有多少个
JavaScript 文件。显式指定组件的 JS 文件，有益于后续优化。

当然，为了把事情简化，默认所有组件都提供 index.js，并且只有它是对外入口，也无不可。

`ui` 对象，是我扩充了用来在后序自动化工作中方便配置组件用的，其中详细字段还会有变更。

#### 技术实现

我自然是希望可以用 mosaic-client 这个示例采用的架构的，子命令通过 `mosaic` 主命令分发，
复杂命令例如 `mosaic-install`，在 `./bin/mosaic-install` 中预处理，在
`./lib/mosaic/install.js` 中实现逻辑代码。这是模仿 component 写的，spm 也采用了这种设计。

与 OPM 目前采用方式的差别是，当用户执行 `mosaic install` 这种命令时，只会加载此命令相关的模块，
而 OPM 会加载所有的模块。

组件目录初始化，我建议采用模板文件的形式，将那几个文件初始化出来。

义宇来估工时吧，希望你能同意我前边对客户端实现方式的设想。

#### 4月3日与义宇沟通后的补充

改个名字，不叫 `package.json`，我同意，顺便提议叫 `brick.json`，一块板砖。

自定义的属性放到另外的 JSON 文件里头去，我觉得没有比较，放到一个属性前缀（例如 bpm）里头，
我也觉得没必要。

index.scss 只是个人观点，Brix Style 和 Brix Gallery 中目前采用的都是 Less，
但我希望可以换成 SCSS，正与基老师探讨可行性，两者优劣，也会在彼项目中说明。

`rc.ini` 文件名，我改成了 config，这样更清楚一些，没接触过 Linux 或者 Mac 系统的同学，对 rc
这个名字可能不太了解。
