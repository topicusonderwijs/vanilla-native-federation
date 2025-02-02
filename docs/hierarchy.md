[[Go back](./introduction.md)]

# Hierarchy

The codebase is divided into 3 categories: utils, handlers and steps.

## Utils

Small generic building blocks for the handlers. 

## Handlers

Handlers are services that handle a specific subdomain or concern. Handlers can rely on other handlers e.g. an import map can rely on (shared) dependencies. The handlers are wired together on the `handlers.resolver.ts` into an object that is passed to every **step** file. 

## Steps

Steps are Overridable/extendible facades that use handlers to perform specific steps in the initialization process. 
