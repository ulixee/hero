declare let _extends: string;
export { _extends as extends };
export declare namespace parserOptions {
    let project: string;
}
export declare let overrides: {
    files: string[];
    rules: {
        'no-restricted-globals': string;
        'no-restricted-properties': (string | {
            object: string;
            property: string;
        })[];
        'no-proto': string;
        'no-extend-native': string;
        'no-inner-declarations': string;
        'prefer-regex-literals': string;
        'max-classes-per-file': string;
        '@typescript-eslint/no-unused-vars': string;
        '@typescript-eslint/explicit-function-return-type': string;
        'prefer-arrow-callback': string;
        'prefer-rest-params': string;
        'func-names': string;
        'no-console': string;
        'lines-around-directive': string;
    };
}[];
