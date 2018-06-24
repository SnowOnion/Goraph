Goraph
---

Goraph := Game of **Go** on any [g**raph**](https://en.wikipedia.org/wiki/Graph_(discrete_mathematics)).

任意[图](https://zh.wikipedia.org/wiki/图_(数学))上的围棋游戏。

# Play

Online: [https://app.sonion.xyz/goraph/](https://app.sonion.xyz/goraph/)

Offline: Open `index.html` in web browser.

# TODO?

## Feature

- [x] 吃子、重来、放弃一手
- [ ] 双方连续各放弃一手则终局
    - [ ] 使可配置
- [ ] 棋盘编辑器
    - [ ] Optical Graph Recognition
- [ ] 中国规则：禁止全同再现
    - [ ] 不同棋盘下规则值得探讨……
- [ ] 悔棋
- [ ] 多人对战
- [ ] AI

## 棋盘

- [x] 双层正方形嵌套
- [ ] 三层正方形嵌套
- [ ] 囧（直线段）
- [ ] * 囧（丿是弧线）
- [ ] 六边形密铺（蜂巢）

## 其他

- [x] Disqus 评论区

# Techniques

没有使用“现代前端技术”。现学了一点儿 [`<canvas>`](https://developer.mozilla.org/zh-CN/docs/Web/API/Canvas_API/Tutorial/Basic_usage) 和 ES6 特性。


# Naming

取名 Goraph 是比较悍然的，因为至少有三个东西叫 Goraph 了：

+ https://github.com/gyuho/goraph
+ https://github.com/starwander/goraph
+ https://github.com/echlebek/goraph

都是 Golang 实现的图论数据结构和算法，( ﾟ∀。)

但是这个世界的重名太多了，不妨再多一个。而且我认为避免冲突应当用 fully qualified name，比如 “奥尔良的少女”、“美国的华莱士”、“…….凤梨科.凤梨属.菠萝”、“真核生物域.植物界.被子植物门.双子叶植物纲.I类真蔷薇分支.黄杨目.黄杨科.黄杨属.大叶黄杨种”、“真核生物域.植物界.被子植物门.双子叶植物纲.冬青目.冬青科.冬青属.*”，而不是就不取一样的名字了。

干，又跑题。
