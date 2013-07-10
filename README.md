# Mosaic

马赛克（Mosaic）是所有以 Brix 组件形式编写的组件的管理工具，将业务中的各个区块以组件形式管理起来。
马赛克希望可以成为 BPM 工具的替代，后者依赖 NPM，不易扩展。

在你使用本工具之前，请先阅读 [Brix 相关文档](http://thx.github.io/brix)。

## 安装

马赛克采用 Node.js 开发，通过 NPM 方式发布。所以使用马赛克，你需要安装：

- Node.js
- NPM

然后在终端执行：

```
npm install mosaic -g
```

装好之后，就可以使用 mosaic 命令了，还可以使用 mo 简写喔

```
mosaic help
mo help
```

## 用法

马赛克工具包含如下功能：

- 发布组件
- 下载组件
- 开发核心组件
- 开发乐高项目

所有功能都以子命令的形式提供，类似 git、brew 等工具：

- mo publish
- mo install
- mo server
- mo lego

### 发布组件

在组件目录执行：

```
mo publish
```

即可。如果不想 cd 来 cd 去，也可以指定一下组件相对当前目录的路径：

```
mo publish mux.tanx/dropdown
```

发布后，将可在 <http://brix.alibaba-inc.com> 看到所有发布的组件，自然也包括你刚发布的这个。
同时也可以在那找到你的组件在 CDN 的地址，通常为：

    http://g.tbcdn.cn/mo/:namespace/:name/:version/:file

如果是 Brix 核心组件，则命名空间为 mosaics ，路径为：

    http://g.tbcdn.cn/mo/mosaics/:name/:version/:file

如何在自己项目中使用这些外部组件（核心组件、或者其他业务组件），请看 <http://thx.github.io/brix>。

### 下载组件

可以下载仓库中的组件到本地，通常这是不必要的，除非你需要将某些组件改头换面到自己业务的命名空间下。

```
mo install mosaics/wangwang/0.1.0
mo install mosaics/wangwang
```

均可。不指定版本的话，则默认下载最新的。将会下载组件包，并解压至当前目录，结构为：

- mosaics
  - wangwang
    - 0.1.0
      - index.js
      - ...

### 开发 Brix 核心组件

Brix 核心组件的命名空间为 mosaics，所有代码都在 <https://github.com/mosaics>，相应的，
我们要求核心组件开发者在本机也将组件目录组织为：

- mosaics
  - dropdown
      - README.md
      - index.js
      - index.css
      - ...
  - breadcrumbs
      - README.md
      - index.js
      - index.css
      - ...

然后，在 mosaics 目录下执行：

```
mo server
```

接着，访问 <http://127.0.0.1:5000/dropdown> 即可预览自己所要开发的组件了。预览的内容根据
README.md 的内容自动产生，具体写法可以参考
[mosaics/wangwang](https://github.com/mosaics/wangwang) 示例。

### 开发基于乐高平台的页面

使用如下命令启动服务：

```
mo lego
```

要求目录组织如下：

- public
  - mux.lego
     - ceiling
         - template.vm
         - index.js
- views
  - index.vm
- server.js

## 实现

[isaacs](http://github.com/isaacs) 大牛对 Node 社区影响深远，要做包管理工具，
完全跟他做的 NPM 不沾边是不实际的。在本项目中，依赖的与 NPM 相关的包有：

 - tar
 - semver
 - fstream
 - fstream-npm

### tar

[tar](https://github.com/isaacs/node-tar) 是 NPM 中使用的打包库，作用很简单，就是
`tar foo.tar foo`，封装了各个平台的兼容性，提供了统一的接口：

```js
fstream
  .Reader('path/to/package')
  .pipe(tar.Pack())
  .pipe(fstream.Writer('package.tar'))
  .on('close', function() {
    fs.existsSync('package.tar')
    // ==> true
  })
```

要打包（tar）一个组件目录，只需将其作为输入流，输送（pipe）到 `tar.Pack()`，再输送到输出流即可。
还可以中间加一个压缩步骤：

```js
fstream
  .Reader('path/to/package')
  .pipe(tar.Pack())
  .pipe(zlib.Gunzip()) // Node 自带
  .pipe(fstream.Writer('package.tgz'))
```

### fstream

fstream 自然不得不提，不清楚 Node 里是什么时候开始有这种流的设计，我还搞不太懂，
只能参考例子凑合着用，在 Node 里，我们可以如此打包、压缩单个文件：

```js
fs.createReadStream('db-backup.sql')
  .pipe(tar.pack())
  .pipe(zlib.Gunzip())
  .pipe(fs.createWriteStream('db-backup.tgz'))
```

但是 `fs.createReadStream` 不支持从目录读取，因此大神 isaacs 封装了 fstream，方便操作。

在 fstream 的基础上，他又搞了 fstream-ignore 和 fstream-npm

### fstream-npm

简单说，这个库的作用就是以一个目录为输入流，根据其中的三个文件内容，忽略掉此目录中的一些文件。
这个忽略的功能，自然是依靠 fstream-ignore 实现的。这三个文件是：

 - [.npmignore](https://npmjs.org/doc/developers.html#Keeping-files-out-of-your-package)
 - [.gitignore](https://help.github.com/articles/ignoring-files)
 - [package.json](https://npmjs.org/doc/json.html)

前两个不言自明，在 fstream-ignore 中已实现，fstream-npm 扩展了第三个，即允许用户在
package.json 中使用 `files` 属性显示指明所包含的文件，类似：

```json
{
  "files": ["index.js", "mosaic.js"]
}
```

### semver

语义化版本，去年就广而告之了，从[官网](http://semver.org)做了摘要，翻译如下：

首先，你要声明一个公共 API。可以由文档和代码本身的约束组成。无论如何，首要的是这个 API 要清晰并且准确。
一旦确认了你的公共 API，你就要通过版本号中的特定上升来说明 API 的改变。设想一种版本格式为 X.Y.Z ，
主版本号.次版本号.补丁版本号。不影响 API 的修复版本，上升补丁版本号；向后兼容的 API 增加、修改，
上升次版本号；向后不兼容的 API 修改，则增加主版本号。

详细的规则，和两个版本号的比较，semver.org 都有，isaacs 在 Node 中实现了这一逻辑，
并在 [node-semver](https://github.com/isaacs/node-semver) 的 README 中描述了其 API，
和版本号比较的逻辑。


