/**
 * Created by Fonov Sergei on 04.12.16.
 */

class runCustomForm extends global.Telegram.BaseScopeExtension {
    process(formData, callback) {
        if(typeof formData.config.title == "undefined")
            throw Error('undefined title')
        if(typeof formData.config.button.cancel == "undefined" || typeof formData.config.button.back == "undefined", typeof formData.config.button.confirm == "undefined")
            throw Error('undefined button')
        if(typeof formData.config.message.confirm == "undefined" || typeof formData.config.message.finish == "undefined")
            throw Error('undefined message')
        if(typeof formData.config.on.cancel == "undefined")
            throw Error('undefined on cancel')
        if(typeof formData.form == "undefined")
            throw Error('undefined form')

        let i = 0

        const run = () => {

            let message,
                keyboard = [],
                config_keybord = [];

            if (i == keys.length) {
                try {
                    config_keybord.push([formData.config.button.confirm], [formData.config.button.cancel, formData.config.button.back])

                    var sendConfirmMessage = () => {
                        this.sendMessage(formData.config.message.confirm(result), {
                            disable_web_page_preview: true,
                            parse_mode: 'HTML',
                            reply_markup: JSON.stringify({
                                one_time_keyboard: true,
                                resize_keyboard: false,
                                keyboard: config_keybord
                            })
                        })
                    }

                    sendConfirmMessage()

                    this.waitForRequest.then(($) => {
                        if($.message.text == formData.config.button.confirm){
                            this.sendMessage(formData.config.message.finish(result), {
                                disable_web_page_preview: true,
                                parse_mode: 'HTML',
                                reply_markup: JSON.stringify({
                                    remove_keyboard: true
                                })
                            }).then(() => {
                                callback(result)
                            })
                        } else if($.message.text == formData.config.button.cancel)
                            formData.config.on.cancel($)
                        else if($.message.text == formData.config.button.back){
                            i--
                            run()
                        } else {
                            sendConfirmMessage()
                        }
                    })
                }
                catch (e) {
                    console.log(`error in user callback: ${e}`)
                }
                return
            }

            const key = formData.form[keys[i]]

            if(Array.isArray(key.keyboard))
                key.keyboard.forEach((key) => {
                    keyboard.push(key)
                })

            key.question = key.question || false
            key.keyboardonly = key.keyboardonly || false
            key.resize_keyboard = key.resize_keyboard || false
            key.confirm = key.confirm || false
            key.select = key.select || false

            if(typeof key.text == "undefined")
                throw Error(`undefined text for: ${keys[i]}`)

            if(typeof key.error == "undefined")
                throw Error(`undefined error for: ${keys[i]}`)

            if(key.keyboardonly && !keyboard.length)
                throw Error(`undefined keyboard for: ${keys[i]}`)

            if((typeof key.validator == "undefined" || typeof key.validator != "function") && !key.keyboardonly)
                throw Error(`undefined validator for: ${keys[i]}`)

            message = `<b>${formData.config.title}</b>`
            for(var y = 0; i+1 > y; y++){
                if(y == i)
                    message += `\n<i>${key.text}${(key.question) ? '?' : ''}</i>`
                else {
                    message += `\n<i>${formData.form[keys[y]].text}</i>`
                    if(typeof result[keys[y]] === 'string')
                        message += `: <b>${result[keys[y]]}</b>`
                    else if(typeof result[keys[y]] === "boolean" && !result[keys[y]])
                        message += ` \u2717`
                    else
                        message += ` \u2714`
                }
            }

            config_keybord.push(formData.config.button.cancel)
            if(i) config_keybord.push(formData.config.button.back)
            keyboard.push(config_keybord)

            console.log(keys)

            this.sendMessage(message, {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    one_time_keyboard: true,
                    resize_keyboard: key.resize_keyboard,
                    keyboard: keyboard
                })
            }).then(() => {
                this.waitForRequest.then(($) => {
                    if($.message.text == formData.config.button.cancel)
                        return formData.config.on.cancel($)
                    else if($.message.text == formData.config.button.back && i){
                        if(formData.form[keys[i-1]].confirm){
                            Object.keys(formData.form[keys[i-1]].confirmCallback.ok).forEach((item) => {
                                if(typeof formData.form[item] != "undefined")
                                    delete formData.form[item]
                            })
                            keys = Object.keys(formData.form)
                        }
                        if(formData.form[keys[i-1]].select){
                            var object = formData.form[keys[i-1]].selectCallback.object(result[keys[i-1]])
                            Object.keys(formData.form[keys[i-1]].selectCallback[object]).forEach((item) => {
                                if(typeof formData.form[item] != "undefined")
                                    delete formData.form[item]
                            })
                            keys = Object.keys(formData.form)
                        }
                        i--
                        return run()
                    }else {
                        if(key.keyboardonly){
                            var valid = false
                            key.keyboard.forEach((buttons) => {
                                buttons.forEach((button) => {
                                    if($.message.text == button){

                                        var pastObject = {},
                                            thisObject = false

                                        if(key.confirm){
                                            var confirmstatus = key.confirmCallback.status(button)
                                            Object.assign(result, {[keys[i]]: confirmstatus})
                                            if(confirmstatus){

                                                keys.forEach((key) => {
                                                    if(thisObject){
                                                        pastObject[key] = formData.form[key]
                                                        delete formData.form[key]
                                                    }
                                                    if(keys[i] == key)
                                                        thisObject = true
                                                })
                                                Object.assign(formData.form, key.confirmCallback.ok)
                                                Object.assign(formData.form, pastObject)
                                                keys = Object.keys(formData.form)
                                            }
                                        }
                                        else if(key.select){



                                            var object = key.selectCallback.object(button)
                                            Object.assign(result, {[keys[i]]: object})


                                            keys.forEach((key) => {
                                                if(thisObject){
                                                    pastObject[key] = formData.form[key]
                                                    delete formData.form[key]
                                                }
                                                if(keys[i] == key)
                                                    thisObject = true
                                            })

                                            console.log(key.selectCallback[object])


                                            Object.assign(formData.form, key.selectCallback[object])
                                            Object.assign(formData.form, pastObject)
                                            keys = Object.keys(formData.form)


                                        }
                                        else {
                                            Object.assign(result, {[keys[i]]: button})
                                        }
                                        i++
                                        valid = true
                                        return run()
                                    }
                                })
                            })
                            if(!valid)
                                this.sendMessage(key.error, {
                                    disable_web_page_preview: true,
                                    parse_mode: 'HTML',
                                    reply_markup: JSON.stringify({
                                        remove_keyboard: true
                                    })
                                }).then(() => {
                                    run()
                                })
                        }else {
                            key.validator($.message, (valid, value) => {
                                if(valid){
                                    Object.assign(result, {[keys[i]]: value})
                                    i++
                                    run()
                                }else {
                                    this.sendMessage(key.error, {
                                        disable_web_page_preview: true,
                                        parse_mode: 'HTML',
                                        reply_markup: JSON.stringify({
                                            remove_keyboard: true
                                        })
                                    }).then(() => {
                                        run()
                                    })
                                }
                            })
                        }
                    }
                })
            })
        }

        var result = {}
        var keys = Object.keys(formData.form)

        run()
    }

    get name() {
        return 'runCustomForm'
    }
}

module.exports = runCustomForm