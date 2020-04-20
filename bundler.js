const fs = require('fs');
const path = require('path');
const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const babel = require('@babel/core');

const moduleAnalyser = (filename) => {
    const content = fs.readFileSync(filename, 'utf-8');
    console.log(content);
    //用字符串分析import太麻烦，因此利用babel/parser对内容进行分析
    //ast为抽象语法树
    const ast = parser.parse(content, {
        sourceType: "module"
    });
    console.log(ast);
    console.log(ast.program.body);
    // 利用babel/traverse找出type为 'ImportDeclaration'
    const dependencies = {};
    traverse(ast, {
        ImportDeclaration({ node }) {
            console.log(node);
            //./src
            const dirname = path.dirname(filename);
            console.log(dirname);
            //将相对路径转换为绝对路径
            const newFile = './' + path.join(dirname, node.source.value);
            dependencies[node.source.value] = newFile;
        }
    });
    console.log(dependencies);
    //将抽象语法树转化成浏览器可运行的代码
    const { code } = babel.transformFromAst(ast, null, {
        presets: ["@babel/preset-env"]
    });
    console.log(code);
    return {
        filename,
        dependencies,
        code
    }
}


const makeDependenciesGraph = (entry) => {
    const entryModule = moduleAnalyser(entry);
    // console.log(entryModule);
    const graphArray = [entryModule];
    for (let i = 0; i < graphArray.length; i++) {
        const item = graphArray[i];
        const { dependencies } = item;
        //若文件有依赖，还要对依赖文件进行分析
        if (dependencies) {
            for (let j in dependencies) {
                graphArray.push(
                    moduleAnalyser(dependencies[j])
                );
            }
        }
    }
    console.log(graphArray);
    //数据格式转换(数组-->对象)
    const graph = {};
    graphArray.forEach(item => {
        graph[item.filename] = {
            dependencies: item.dependencies,
            code: item.code
        }
    })
    return graph;
}


const generateCode = (entry) => {
    //利用JSON.stringify将对象参数转化为字符串参数
    const graph = JSON.stringify(makeDependenciesGraph(entry));
    //生成浏览器可运行的代码（字符串）。整个代码运行在一个闭包里，里面定义了require函数，及exports对象
    return `
        (function(graph){
         
            function require(module){      
                function localRequire(relativePath){
                    return require(graph[module].dependencies[relativePath]);            
                }       
            
                var exports = {};

                (function(require,exports,code){
                    eval(code)
                })(localRequire,exports,graph[module].code);
                return exports;

            };
            require('${entry}')
        })(${graph})
    `;
}

const moduleInfor = moduleAnalyser('./src/index.js');
console.log(moduleInfor);

const graphInfo = makeDependenciesGraph('./src/index.js');
console.log(graphInfo);

const code = generateCode('./src/index.js');
console.log(code);

//将code复制粘贴到浏览器控制台，输出say hello
