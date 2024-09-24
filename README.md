# The Parser Generator

This repository contains source code for a [ProJor](https://projor.io) template, that can be used to generate _parsers_ for certain languages. These parsers can be used with the [ProJor Languages](https://docs.projor.io/overview/languages.html) feature, to allow for _compact_ and _readable_ representation of a domain model.

Language definitions are stored in the [`.projor/languages.pdata.yaml`](.projor/languages.pdata.yaml) file. Parsers for the following languages are generated:

| Name | Description | Parser file | Example file |
| --- | --- | --- | --- |
| PagesLang | Language describing pages in an admin site | [pages-lang.parser.js](src/pages-lang.parser.js) | [test.pages](examples/test.pages) |
| EntityLang | Language describing entities for a CRUD API | [entity-lang.parser.js](src/entity-lang.parser.js) | [test.entities](examples/test.entities) |

# License

The contents of this repository are licensed under [MIT](./LICENSE.md).

[ProJor](https://projor.io) is a product by [SIOCODE](https://siocode.hu), and it is licensed under the [ProJor Free License](https://license.projor.io), or the [ProJor Commercial License](https://license.projor.io).