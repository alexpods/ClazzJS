var PropertiesProcessor = new Meta.Processor.Chain({

    init:      PropertiesInitProcessor,
    interface: PropertiesInterfaceProcessor,
    meta:      PropertiesMetaProcessor,
    defaults:  PropertiesDefaultsProcessor

})