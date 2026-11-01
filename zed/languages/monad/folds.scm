; Vendored from tree-sitter-monad (https://tangled.org/monad-lang.org/tree-sitter-monad)
; at commit 740bc6e1f74b8fe4e387beb87047941534991fd1 (v0.2.0), Apache-2.0.
; Keep in sync per docs/language-server.md in this repo.

;
; Generic brace-delimited bodies
;
"{" @fold.start
"}" @fold.end

;
; Do blocks
;
(do) @fold.start

;
; Match bodies
;
(match_term) @fold.start

;
; Type/struct/class/instance/decls bodies
;
(type_decl) @fold.start
(struct) @fold.start
(class) @fold.start
(instance) @fold.start
(decls_block) @fold.start

;
; Multi-line comments
;
(comment) @fold.start
