/// <reference types="@phoenix/phoenix-cli" />
namespace Ergo {
    const _p = Phoenix,
        _customData = _p.customData;
    class GridLinesAsCols extends Phoenix.ui.FormController {
        public onModelChanged(action, model, form) {
            switch (action.property) {
                case 'documents.$item.children.$item.children.$item.sizes.$item.value':
                    if (action.params.instance.id === 777) {
                        if (action.params.instance.value === 0) {
                            _p.utils.nextTick(() => {
                                model.applyJsonPachDelta([{
                                    op: 'remove',
                                    path: '/documents/1/children/5/children/6/sizes/777',
                                    value: null
                                }
                                ]);

                            });
                        } else {
                            if (action.params.instance.value === 88) {
                                _p.utils.nextTick(() => {
                                    model.applyJsonPachDelta([{
                                        op: 'replace',
                                        path: '/documents/1/children/5/children/6/sizes',
                                        value: [
                                            {
                                                id: 777,
                                                code: 'population',
                                                value: 100
                                            }
                                        ]
                                    }
                                    ]);
    
                                });
                                }  

                        }

                    }
                    break;
                case 'documents.1.children.5.children.6.$links.addValue':
                    _p.utils.nextTick(() => {
                        model.applyJsonPachDelta([{
                            op: 'add',
                            path: '/documents/1/children/5/children/6/sizes',
                            value: {
                                id: 777,
                                code: 'population',
                                value: action.actionParams.value
                            }
                        }
                        ]);

                    });
                    break;
            }

        }
    }
    _customData.register('demos.grid-lines-as-cols.controller', new GridLinesAsCols());
}
