# blog-new

一个极简静态博客发布仓库：AI 生成 HTML 内容，脚本生成文章页和首页，然后直接上传 `public/` 到服务器静态目录。

## 常用命令

生成一篇文章：

```bash
npm run new -- --title "Next.js ISR 总结" --summary "一篇关于 ISR 的速记" --tags "Next.js,部署" --content-file ./draft.html
```

从标准输入读取 HTML 内容：

```bash
printf '<h2>标题</h2><p>正文</p>' | npm run new -- --title "AI 总结" --summary "摘要" --tags "AI,Blog" --stdin
```

重新生成首页：

```bash
npm run build
```

本地预览：

```bash
npm run serve
```

发布到服务器：

```bash
cp .env.example .env
npm run publish
```

`publish` 通过 `rsync` 上传 `public/`，需要本机能 SSH 到目标服务器。
