# metal-tools-soy

Tool that can be used to compile metal soy files.

## SoyToIncrementalDomSrcCompiler

This project uses the `SoyToIncrementalDomSrcCompiler` to compile the soy files to metal using Incremental DOM. Since the compiler is not independently released, the process to update it in this project is as follows:

1. Clone the [https://github.com/google/closure-templates](google/closure-templates) repository
2. Update the `<version>` value inside `pom.xml` to the date of the latest commit that is going to get released using `yyyy-mm-dd` as the date format
3. Run `mvn install` on the root folder
4. Copy the generated file from `~/.m2/repository/com/google/template/soy/{version}/soy-{version}-SoyToIncrementalDomSrcCompiler.jar` to the `jar` folder in this project
