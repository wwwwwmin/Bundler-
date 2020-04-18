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
    //将抽象语法树转化成对象
    const {code} = babel.transformFromAst(ast,null,{
        presets:["@babel/preset-env"]
    });
    console.log(code);
    return {
        filename,
        dependencies,
        code
    }
}

const moduleInfor =  moduleAnalyser('./src/index.js');
console.log(moduleInfor);