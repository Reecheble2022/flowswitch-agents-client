import React, { useState, useRef, useEffect } from 'react';
import { useAgentRegistration } from "../agentRegistrationProvider";

const AgentRegistrationTriggerButton = ({ }) => {

    const { triggerAgentRegistrationPrompt } = useAgentRegistration()

    return (
        <div className="items-center border-t mt-10">
            <div className="w-[70%] hover:text-blue-600 my-4 p-2 rounded-md mx-auto cursor-pointer" 
                onClick={() => {
                    triggerAgentRegistrationPrompt({})
                }}
            >
                Signup as an agent 
            </div>
        </div>
    );
};

export default AgentRegistrationTriggerButton;