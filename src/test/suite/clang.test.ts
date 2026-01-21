import * as assert from 'assert';

import { Command, ClangCommand, NVCCCommand, RustcCommand } from '../../clang';

suite('Command Test Suite', () => {
	console.log('Start all tests.');
    var path = require('path');
    let appRoot = path.resolve(__dirname);
    console.log(appRoot);
    process.chdir(path.join(appRoot, '..', '..', '..', 'example'));

	test('clang++ commands test', async () => {
        let cmd = await Command.createFromString("clang++ -std=c++17 -Wall -Wextra -Wpedantic -Werror -o a.exe main.cpp");
        let clangCmd = cmd as ClangCommand;
        
        assert.strictEqual(clangCmd.getInputPath(), "main.cpp");
        assert.strictEqual(clangCmd.getOutputPath(), "a.exe");

        let pp = clangCmd.subCommands[0];
        assert.strictEqual(pp.getType(), "CC1Command");
        assert.strictEqual(pp.getOutputPath(), "main.ii");
        console.log(pp.toString());

	});

    test('nvcc commands test', async () => {
        let cmd = await Command.createFromString("nvcc -std=c++17 -arch=sm_75 -o a.exe main.cu");
        let nvcc_cmd = cmd as NVCCCommand;
        
        // assert.strictEqual(nvcc_cmd.getInputPath(), "main.cu");
        // assert.strictEqual(nvcc_cmd.getOutputPath(), "a.exe");
        assert.notStrictEqual(nvcc_cmd.subCommands.length, 0);
        let pp = nvcc_cmd.subCommands[0];
        console.log(pp.toString());
    });

	test('rustc basic command test', async () => {
        let cmd = await Command.createFromString("rustc main.rs");
        assert.strictEqual(cmd?.getType(), "RustcCommand");
        
        let rustcCmd = cmd as RustcCommand;
        assert.strictEqual(rustcCmd.getInputPath(), "main.rs");
        assert.strictEqual(rustcCmd.getOutputPath(), "main");
        assert.strictEqual(rustcCmd.isOutputToStdout(), false);
        
        // Check that default flags are set
        assert.strictEqual(rustcCmd.bEmitLLVM, true);
        assert.strictEqual(rustcCmd.bEmitASM, true);
        
        let args = rustcCmd.getArgs();
        console.log("rustc basic args:", args);
        
        // Should contain --emit flag
        assert.ok(args.includes("--emit"));
    });

	test('rustc with output file test', async () => {
        let cmd = await Command.createFromString("rustc main.rs -o output.exe");
        assert.strictEqual(cmd?.getType(), "RustcCommand");
        
        let rustcCmd = cmd as RustcCommand;
        assert.strictEqual(rustcCmd.getInputPath(), "main.rs");
        assert.strictEqual(rustcCmd.getOutputPath(), "output.exe");
        assert.strictEqual(rustcCmd.isOutputToStdout(), false);
        
        console.log("rustc with output:", rustcCmd.toString());
    });

	test('rustc with optimization flags test', async () => {
        let cmd = await Command.createFromString("rustc main.rs -O");
        assert.strictEqual(cmd?.getType(), "RustcCommand");
        
        let rustcCmd = cmd as RustcCommand;
        let args = rustcCmd.getArgs();
        
        // Should have -O flag preserved
        assert.ok(args.includes("-O"));
        console.log("rustc optimized args:", args);
    });

	test('rustc with emit flags test', async () => {
        let cmd = await Command.createFromString("rustc main.rs --emit llvm-ir,asm");
        assert.strictEqual(cmd?.getType(), "RustcCommand");
        
        let rustcCmd = cmd as RustcCommand;
        let args = rustcCmd.getArgs();
        
        // Original --emit should be filtered, and new one added based on flags
        assert.ok(args.includes("--emit"));
        console.log("rustc emit args:", args);
    });

	test('rustc with codegen options test', async () => {
        let cmd = await Command.createFromString("rustc main.rs -C opt-level=3");
        assert.strictEqual(cmd?.getType(), "RustcCommand");
        
        let rustcCmd = cmd as RustcCommand;
        let args = rustcCmd.getArgs();
        
        // Should preserve -C opt-level=3
        assert.ok(args.includes("-C"));
        assert.ok(args.includes("opt-level=3"));
        console.log("rustc codegen args:", args);
    });

	test('rustc with filter test', async () => {
        let cmd = await Command.createFromString("rustc main.rs -O");
        assert.strictEqual(cmd?.getType(), "RustcCommand");
        
        let rustcCmd = cmd as RustcCommand;
        rustcCmd.setFilter("add");
        
        let args = rustcCmd.getArgs();
        
        // Should add filter-print-funcs
        let filterArg = args.find(arg => arg.includes("filter-print-funcs=add"));
        assert.ok(filterArg !== undefined, "Filter argument should be present");
        console.log("rustc filtered args:", args);
    });

	test('rustc with llvm-args test', async () => {
        let cmd = await Command.createFromString("rustc main.rs -C llvm-args=-print-changed");
        assert.strictEqual(cmd?.getType(), "RustcCommand");
        
        let rustcCmd = cmd as RustcCommand;
        let args = rustcCmd.getArgs();
        
        // Check for llvm-args
        let hasLLVMArgs = args.some(arg => arg.includes("llvm-args"));
        assert.ok(hasLLVMArgs, "Should have llvm-args");
        console.log("rustc llvm-args:", args);
    });

	test('rustc multiple input files test', async () => {
        // Create a command with multiple .rs files (edge case)
        let cmd = await Command.createFromString("rustc main.rs lib.rs");
        assert.strictEqual(cmd?.getType(), "RustcCommand");
        
        let rustcCmd = cmd as RustcCommand;
        // Rustc typically takes one input, but our parser should handle it
        assert.strictEqual(rustcCmd.input.length >= 1, true);
        console.log("rustc multiple inputs:", rustcCmd.input);
    });
});
