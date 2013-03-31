# Mosaic Client

马赛克（Mosaic）管理工具，与 Mosaic Server 配合，将业务中的各个区块以组件形式管理起来。

马赛克客户端与服务端一样，都是简单示例，目的是简化目前的 BPM 结构，使其更容易支持淘系自身的业务场景。
BPM 目前依赖 NPM，不易扩展，为后序版本演进方便，因此做了这个示例，看看可以简化成什么样子。

## 依赖

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
