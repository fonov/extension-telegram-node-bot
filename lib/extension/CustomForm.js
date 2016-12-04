/**
 * Created by Fonov Sergei on 04.12.16.
 */
    
class runCustomForm extends global.Telegram.BaseScopeExtension {
    process($, formData, callback) {
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
                        $.sendMessage(formData.config.message.confirm(result), {
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

                    $.waitForRequest.then(($) => {
                        if($.message.text == formData.config.button.confirm){
                            $.sendMessage(formData.config.message.finish(result), {
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

            if(typeof key.text == "undefined")
                throw Error(`undefined text for: ${keys[i]}`)

            if(typeof key.error == "undefined")
                throw Error(`undefined error for: ${keys[i]}`)

            if(key.keyboardonly && !keyboard.length)
                throw Error(`undefined keyboard for: ${keys[i]}`)

            if((typeof key.validator == "undefined" || typeof key.validator != "function") && !key.keyboardonly)
                throw Error(`undefined validator for: ${keys[i]}`)

            key.question = key.question || false
            key.keyboardonly = key.keyboardonly || false
            key.resize_keyboard = key.resize_keyboard || false


            message = `<b>${formData.config.title}</b>`
            for(var y = 0; i+1 > y; y++){
                if(y == i)
                    message += `\n<i>${key.text}${(key.question) ? '?' : ''}</i>`
                else {
                    if(typeof result[keys[y]] === 'string')
                        message += `\n<i>${formData.form[keys[y]].text}:</i> <b>${result[keys[y]]}</b>`
                    else
                        message += `\n<i>${formData.form[keys[y]].text}</i> \u2714`
                }
            }

            config_keybord.push(formData.config.button.cancel)
            if(i) config_keybord.push(formData.config.button.back)
            keyboard.push(config_keybord)

            $.sendMessage(message, {
                disable_web_page_preview: true,
                parse_mode: 'HTML',
                reply_markup: JSON.stringify({
                    one_time_keyboard: true,
                    resize_keyboard: key.resize_keyboard,
                    keyboard: keyboard
                })
            }).then(() => {
                $.waitForRequest.then(($) => {
                    if($.message.text == formData.config.button.cancel)
                        return formData.config.on.cancel($)
                    else if($.message.text == formData.config.button.back && i){
                        i--
                        return run()
                    }else {
                        if(key.keyboardonly){
                            var flag = false
                            key.keyboard.forEach((key1) => {
                                key1.forEach((key2) => {
                                    if($.message.text == key2){
                                        Object.assign(result, {[keys[i]]: key2})
                                        i++
                                        flag = true
                                        return run()
                                    }
                                })
                            })
                            if(!flag)
                                $.sendMessage(key.error, {
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
                                    $.sendMessage(key.error, {
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
        const keys = Object.keys(formData.form)

        run()
    }

    get name() {
        return 'runCustomForm'
    }
}

module.exports = runCustomForm