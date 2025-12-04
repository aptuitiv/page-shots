# Testing while developing local

## Testing locally with another project

In the `page-shots` library path use `npm link` to add the project to the local npm registry.

```bash
cd ./route-to-library
npm link
```

In the project's folder that you want to use this library, use `npm link page-shots` to install the package locally.

If you need to update the rets-client library do the following.

### Unlink the project

You should unlink the local project for any of these situations:

- You are switching branches.
- You are adding or removing node modules in this project. (This doesn't apply if you're adding or removing node modules in the project that uses this library.)
- You want to use the live version of this package from NPM.

First, in the project that uses this library:

```bash
npm unlink page-shots --no-save
```

The `--no-save` flag keeps the original live version of this package from NPM.

Then, in this package:

```bash
npm unlink
```

## Resources

- [NPM Linking and Unlinking](https://dev.to/erinbush/npm-linking-and-unlinking-2h1g).
- [Understanding npm-link](https://medium.com/dailyjs/how-to-use-npm-link-7375b6219557).
- [How to Test a Node (npm) Package Locally](https://javascript.plainenglish.io/how-to-test-a-node-package-locally-8dde33e642df).
- Other option wth tarballs [Use npm pack to test your packages locally](https://dev.to/scooperdev/use-npm-pack-to-test-your-packages-locally-486e).
